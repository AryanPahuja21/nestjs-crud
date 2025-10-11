import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  HttpStatus,
  HttpCode,
  Headers,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { buildSuccessResponse } from '../../utils/response.util';
import { ApiResponse as ApiResponseType } from '../../types/response.types';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment } from '../../database/schemas/payment.schema';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment intent for a product' })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createPaymentIntent(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<
    ApiResponseType<{
      clientSecret: string;
      paymentIntentId: string;
      payment: PaymentResponseDto;
    }>
  > {
    const userId = req.user.sub;
    const result = await this.paymentService.createPaymentIntent(userId, dto);

    return buildSuccessResponse({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      payment: this.mapToResponseDto(result.payment),
    });
  }

  @Post('confirm-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm a payment intent (simple test method)' })
  async confirmPaymentIntent(@Body() body: { intentId: string }) {
    const { intentId } = body;

    // Initialize Stripe with config
    const stripe = new Stripe(this.configService.get<string>('stripe.secretKey')!, {
      apiVersion: '2025-09-30.clover',
    });

    const confirmed = await stripe.paymentIntents.confirm(intentId, {
      payment_method: 'pm_card_visa', // Stripe test card
    });

    return confirmed;
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a payment' })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async confirmPayment(
    @Body() dto: ConfirmPaymentDto,
  ): Promise<ApiResponseType<PaymentResponseDto>> {
    const payment = await this.paymentService.confirmPayment(dto);

    return buildSuccessResponse(this.mapToResponseDto(payment));
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
    type: [PaymentResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPayments(
    @Request() req: { user: { sub: string } },
  ): Promise<ApiResponseType<PaymentResponseDto[]>> {
    const userId = req.user.sub;
    const payments = await this.paymentService.getPaymentsByUser(userId);

    return buildSuccessResponse(payments.map((payment) => this.mapToResponseDto(payment)));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific payment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentById(@Param('id') id: string): Promise<ApiResponseType<PaymentResponseDto>> {
    const payment = await this.paymentService.getPaymentById(id);

    return buildSuccessResponse(this.mapToResponseDto(payment));
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook handled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: { rawBody?: Buffer },
  ): Promise<{ received: boolean }> {
    const endpointSecret = this.configService.get<string>('stripe.webhookSecret');
    const secretKey = this.configService.get<string>('stripe.secretKey');

    if (!endpointSecret || !secretKey) {
      throw new Error('Stripe configuration is missing');
    }

    if (!req.rawBody) {
      throw new Error('Raw body is required for webhook verification');
    }

    let event: Stripe.Event;

    try {
      const stripe = new Stripe(secretKey, { apiVersion: '2025-09-30.clover' });
      event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.log(`Webhook signature verification failed: ${errorMessage}`);
      throw new Error('Invalid webhook signature');
    }

    await this.paymentService.handleWebhook(event);

    return { received: true };
  }

  private mapToResponseDto(
    payment: Payment & { createdAt?: Date; updatedAt?: Date },
  ): PaymentResponseDto {
    return {
      id: (payment._id as { toString(): string })?.toString() || payment.id || '',
      userId: payment.userId?.toString() || '',
      productId: payment.productId?.toString() || '',
      stripePaymentIntentId: payment.stripePaymentIntentId || '',
      amount: payment.amount || 0,
      currency: payment.currency || 'usd',
      status: payment.status,
      type: payment.type,
      description: payment.description || '',
      paidAt: payment.paidAt,
      createdAt: payment.createdAt || new Date(),
      updatedAt: payment.updatedAt || new Date(),
    };
  }
}
