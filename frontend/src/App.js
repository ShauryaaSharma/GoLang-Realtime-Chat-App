import React, { Component } from 'react';
import Header from './components/Header/Header';
import ChatHistory from './components/ChatHistory/ChatHistory';
import ChatInput from './components/ChatInput/ChatInput';
import './App.css';
import { connect, sendMsg } from './api';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chatHistory: [],
      username: '',
      usernameInput: '',
      connectionStatus: 'disconnected',
      messageCount: 0,
      xp: 0,
    };
    this.send = this.send.bind(this);
    this.handleUsernameSubmit = this.handleUsernameSubmit.bind(this);
  }

  componentDidMount() {
    connect(
      (msg) => {
        const timestamp = Date.now();
        // msg is a native MessageEvent — its props are non-enumerable, so
        // spread ({...msg}) loses everything. Capture .data explicitly.
        this.setState(prevState => ({
          chatHistory: [...prevState.chatHistory, { data: msg.data, timestamp }],
          xp: prevState.xp + 5,
        }));
      },
      (status) => {
        this.setState({ connectionStatus: status });
      }
    );
  }

  handleUsernameSubmit(e) {
    e.preventDefault();
    const name = this.state.usernameInput.trim();
    if (name.length > 0) {
      this.setState({ username: name });
    }
  }

  send(event) {
    if (event.keyCode === 13 && event.target.value.trim()) {
      const raw = event.target.value.trim();
      // Send as JSON with the username attached
      const payload = JSON.stringify({
        body: raw,
        user: this.state.username || 'Anonymous',
      });
      sendMsg(payload);
      event.target.value = '';
      this.setState(prevState => ({
        messageCount: prevState.messageCount + 1,
        xp: prevState.xp + 10,
      }));
    }
  }

  getLevel() {
    return Math.floor(this.state.xp / 100) + 1;
  }

  getXpProgress() {
    return this.state.xp % 100;
  }

  render() {
    const { username, usernameInput, connectionStatus, chatHistory, messageCount } = this.state;
    const level = this.getLevel();
    const xpProgress = this.getXpProgress();

    if (!username) {
      return (
        <div className="login-overlay">
          <div className="login-box">
            <div className="logo-text">NEXUS</div>
            <div className="login-sub">Realtime Chat Protocol v2.0</div>
            <form onSubmit={this.handleUsernameSubmit}>
              <input
                type="text"
                placeholder="ENTER CALLSIGN"
                value={usernameInput}
                onChange={e => this.setState({ usernameInput: e.target.value })}
                autoFocus
                maxLength={20}
              />
              <button type="submit">JACK IN</button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="App">
        <Header
          username={username}
          level={level}
          xpProgress={xpProgress}
          messageCount={messageCount}
          connectionStatus={connectionStatus}
        />
        <ChatHistory chatHistory={chatHistory} username={username} />
        <ChatInput send={this.send} username={username} />
      </div>
    );
  }
}

export default App;
