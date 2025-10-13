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
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { AttachPaymentMethodDto } from './dto/attach-payment-method.dto';
import { SetDefaultPaymentMethodDto } from './dto/set-default-payment-method.dto';
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        intentId: {
          type: 'string',
          example: 'pi_1234567890_secret_1234567890',
          description: 'The payment intent ID to confirm',
        },
      },
      required: ['intentId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment intent confirmed successfully',
  })
  async confirmPaymentIntent(@Body() body: { intentId: string }) {
    const { intentId } = body;

    // Initialize Stripe with config
    const stripe = new Stripe(this.configService.get<string>('stripe.secretKey')!, {
      apiVersion: '2025-09-30.clover',
    });

    const confirmed = await stripe.paymentIntents.confirm(intentId, {
      payment_method: 'pm_card_visa', // Stripe test card
      return_url: 'http://localhost:3000/payment/success', // Required for redirect-based payment methods
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

  @Get('customer/payment-methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payment methods for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'pm_1234567890' },
              type: { type: 'string', example: 'card' },
              card: {
                type: 'object',
                properties: {
                  brand: { type: 'string', example: 'visa' },
                  last4: { type: 'string', example: '4242' },
                  exp_month: { type: 'number', example: 12 },
                  exp_year: { type: 'number', example: 2025 },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerPaymentMethods(
    @Request() req: { user: { sub: string; stripeCustomerId?: string } },
  ): Promise<ApiResponseType<Stripe.PaymentMethod[]>> {
    const userId = req.user.sub;

    // Get user to find their Stripe customer ID
    const stripe = new Stripe(this.configService.get<string>('stripe.secretKey')!, {
      apiVersion: '2025-09-30.clover',
    });

    // For now, we'll need to get the customer ID from the user
    // In a real implementation, you'd get this from the user service
    const customers = await stripe.customers.list({
      limit: 100, // Get more customers to search through
    });

    // Find customer by userId in metadata
    const customer = customers.data.find((c) => c.metadata?.userId === userId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const customerId = customer.id;
    const paymentMethods = await this.paymentService.getCustomerPaymentMethods(customerId);

    return buildSuccessResponse(paymentMethods);
  }

  @Post('customer/payment-methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attach a payment method to the authenticated user' })
  @ApiResponse({
    status: 201,
    description: 'Payment method attached successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'pm_1234567890' },
            type: { type: 'string', example: 'card' },
            customer: { type: 'string', example: 'cus_1234567890' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async attachPaymentMethod(
    @Request() req: { user: { sub: string } },
    @Body() dto: AttachPaymentMethodDto,
  ): Promise<ApiResponseType<Stripe.PaymentMethod>> {
    const userId = req.user.sub;

    // Get customer ID from user
    const stripe = new Stripe(this.configService.get<string>('stripe.secretKey')!, {
      apiVersion: '2025-09-30.clover',
    });

    const customers = await stripe.customers.list({
      limit: 100, // Get more customers to search through
    });

    // Find customer by userId in metadata
    const customer = customers.data.find((c) => c.metadata?.userId === userId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const customerId = customer.id;
    const paymentMethod = await this.paymentService.attachPaymentMethod(
      customerId,
      dto.paymentMethodId,
    );

    return buildSuccessResponse(paymentMethod);
  }

  @Delete('customer/payment-methods/:paymentMethodId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detach a payment method from the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Payment method detached successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'pm_1234567890' },
            type: { type: 'string', example: 'card' },
            customer: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async detachPaymentMethod(
    @Param('paymentMethodId') paymentMethodId: string,
  ): Promise<ApiResponseType<Stripe.PaymentMethod>> {
    const paymentMethod = await this.paymentService.detachPaymentMethod(paymentMethodId);

    return buildSuccessResponse(paymentMethod);
  }

  @Patch('customer/default-payment-method')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set default payment method for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Default payment method set successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cus_1234567890' },
            invoice_settings: {
              type: 'object',
              properties: {
                default_payment_method: { type: 'string', example: 'pm_1234567890' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setDefaultPaymentMethod(
    @Request() req: { user: { sub: string } },
    @Body() dto: SetDefaultPaymentMethodDto,
  ): Promise<ApiResponseType<Stripe.Customer>> {
    const userId = req.user.sub;

    // Get customer ID from user
    const stripe = new Stripe(this.configService.get<string>('stripe.secretKey')!, {
      apiVersion: '2025-09-30.clover',
    });

    const customers = await stripe.customers.list({
      limit: 100, // Get more customers to search through
    });

    // Find customer by userId in metadata
    const customer = customers.data.find((c) => c.metadata?.userId === userId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const customerId = customer.id;
    const updatedCustomer = await this.paymentService.setDefaultPaymentMethod(
      customerId,
      dto.paymentMethodId,
    );

    return buildSuccessResponse(updatedCustomer);
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: String(payment._id) || payment.id || '',
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
