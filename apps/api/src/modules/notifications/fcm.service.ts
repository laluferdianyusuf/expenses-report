import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private enabled = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('FCM_PROJECT_ID');
    const clientEmail = this.config.get<string>('FCM_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FCM_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey) {
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
          });
        }
        this.enabled = true;
        this.logger.log('Firebase FCM push notifications enabled');
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin', error);
      }
    } else {
      this.logger.warn('FCM credentials not configured — push notifications disabled');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async sendToToken(token: string, payload: PushPayload) {
    if (!this.enabled || !token) return null;

    try {
      const messageId = await admin.messaging().send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      return messageId;
    } catch (error) {
      this.logger.warn(
        `FCM send failed: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  async sendToTokens(tokens: string[], payload: PushPayload) {
    const validTokens = tokens.filter(Boolean);
    if (!this.enabled || validTokens.length === 0) return { success: 0, failure: 0 };

    const results = await Promise.allSettled(
      validTokens.map((token) => this.sendToToken(token, payload)),
    );

    const success = results.filter((r) => r.status === 'fulfilled' && r.value).length;
    return { success, failure: validTokens.length - success };
  }
}
