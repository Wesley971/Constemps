import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

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
}
