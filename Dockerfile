FROM node:18.3.0-alpine3.15 as run
WORKDIR /src

COPY . .

# RUN npm install --global yarn

RUN npm upgrade --location=global yarn 

RUN yarn
RUN yarn build

CMD ["yarn", "start"]