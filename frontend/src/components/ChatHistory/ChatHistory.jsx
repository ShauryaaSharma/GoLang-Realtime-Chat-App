import React, { Component } from 'react';
import './ChatHistory.scss';
import Message from '../Message/Message';

class ChatHistory extends Component {
  constructor(props) {
    super(props);
    // Manage our own scroll-anchor ref so App.js doesn't need to wire it up.
    this.chatEndRef = React.createRef();
  }

  componentDidUpdate() {
    // Auto-scroll to the latest message whenever chatHistory changes.
    if (this.chatEndRef.current) {
      this.chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  render() {
    const { chatHistory, username } = this.props;

    if (!chatHistory || chatHistory.length === 0) {
      return (
        <div className='ChatHistory'>
          <div className='chat-empty'>
            <div className='chat-empty-icon'>📡</div>
            <div className='chat-empty-text'>Awaiting transmissions...</div>
          </div>
          <div ref={this.chatEndRef} />
        </div>
      );
    }

    const messages = chatHistory.map((msg, idx) => (
      <Message
        key={idx}
        message={msg.data}
        currentUser={username}
        timestamp={msg.timestamp}
      />
    ));

    return (
      <div className='ChatHistory'>
        {messages}
        <div ref={this.chatEndRef} />
      </div>
    );
  }
}

export default ChatHistory;
