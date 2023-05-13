FROM node:20

WORKDIR /opt/app

ENV NODE_ENV=production

COPY --chown=node:node package.json .
COPY --chown=node:node package-lock.json .
COPY --chown=node:node tsconfig.json .
COPY --chown=node:node prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

RUN chown node:node /opt/app/

USER node

CMD [ "npm", "run", "start:migrate"]
