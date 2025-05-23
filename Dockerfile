FROM node:20 AS build-env
WORKDIR /app
COPY . .
RUN npm ci

FROM gcr.io/distroless/nodejs20-debian11
COPY --from=build-env /app /app
WORKDIR /app
VOLUME ["/app/database.json"]
VOLUME ["/app/config.json"]
EXPOSE 3000/tcp

CMD [ "/app/shady_srv.js" ]