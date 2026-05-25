package websocket

import "fmt"

type Pool struct {
	Register   chan *Client
	Unregister chan *Client
	Clients    map[*Client]bool
	Broadcast  chan Message
}

func NewPool() *Pool {
	return &Pool{
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
		Broadcast:  make(chan Message),
	}
}

func (pool *Pool) Start() {
	for {
		select {
		case client := <-pool.Register:
			pool.Clients[client] = true
			fmt.Println("Size of Connection Pool: ", len(pool.Clients))
			for c := range pool.Clients {
				// Use SafeWriteJSON to prevent concurrent write races
				if err := c.SafeWriteJSON(Message{Type: 1, Body: "New User Joined..."}); err != nil {
					fmt.Println("Error notifying client on register:", err)
				}
			}

		case client := <-pool.Unregister:
			delete(pool.Clients, client)
			fmt.Println("Size of Connection Pool: ", len(pool.Clients))
			for c := range pool.Clients {
				if err := c.SafeWriteJSON(Message{Type: 1, Body: "User Disconnected..."}); err != nil {
					fmt.Println("Error notifying client on unregister:", err)
				}
			}

		case message := <-pool.Broadcast:
			fmt.Println("Sending message to all clients in Pool")
			for c := range pool.Clients {
				if err := c.SafeWriteJSON(message); err != nil {
					// Fix: use continue instead of return so one bad client
					// doesn't kill the entire pool goroutine.
					fmt.Println("Error broadcasting to client, skipping:", err)
					continue
				}
			}
		}
	}
}
