# server/Dockerfile
FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos de dependência primeiro
COPY package.json package-lock.json* ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Build do projeto
RUN npm run build

# Expõe a porta
EXPOSE 3001

# Comando de start
CMD ["node", "dist/server.js"]