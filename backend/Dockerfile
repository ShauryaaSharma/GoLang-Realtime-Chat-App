FROM golang:1.21-alpine
RUN apk add --no-cache bash ca-certificates git gcc g++ libc-dev
RUN mkdir /app 
ADD . /app/ 
WORKDIR /app 
RUN go mod download
# Fix: specify the output binary name explicitly.
# Without -o, 'go build' names the binary after the workdir ('app'), not the module.
RUN go build -o /app/realtime-chat-go-react .
CMD ["/app/realtime-chat-go-react"]
