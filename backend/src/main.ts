import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { TraceIdInterceptor } from "./common/interceptors/trace-id.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ErrorHandlingInterceptor } from "./common/interceptors/error-handling.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(
    new TraceIdInterceptor(),
    new LoggingInterceptor(),
    new ErrorHandlingInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle("Motorcycle Trip Tracker API")
    .setDescription("API for tracking motorcycle trips based on GPS pings")
    .setVersion("1.0")
    .addTag("trips")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
