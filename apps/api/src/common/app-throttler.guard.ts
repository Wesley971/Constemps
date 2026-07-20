import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ThrottlerLimitDetail } from '@nestjs/throttler';

interface RequestWithUser {
  user?: { id: string };
  ip?: string;
  body?: { rating?: unknown };
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // Sur /reviews, seule la voie OPEN_QUESTION déclenche un appel Gemini payant.
    // Le rating manuel (CLASSIC) ne coûte rien et peut être soumis en rafale
    // pendant une session de révision : pas de throttle IA dessus.
    if (
      context.getClass().name === 'ReviewsController' &&
      context.getHandler().name === 'submitReview'
    ) {
      const req = context.switchToHttp().getRequest<RequestWithUser>();
      if (req.body?.rating) {
        return true;
      }
    }
    return super.shouldSkip(context);
  }

  protected getTracker(req: RequestWithUser): Promise<string> {
    return Promise.resolve(req.user?.id ?? req.ip ?? 'unknown');
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    if (
      context.getClass().name === 'CardsController' &&
      context.getHandler().name === 'generateAudio'
    ) {
      throw new HttpException(
        'Quota audio quotidien atteint, réessaie demain',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
