FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src

RUN apk add --no-cache maven && \
    mvn -q -DskipTests clean package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S novabank && adduser -S novabank -G novabank
USER novabank

COPY --from=builder /app/target/novabank-api-*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
