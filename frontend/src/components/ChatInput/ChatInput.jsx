import React, { Component } from 'react';
import './ChatInput.scss';

class ChatInput extends Component {
  render() {
    return (
      <div className='ChatInput'>
        <input
          onKeyDown={this.props.send}
          placeholder="Transmit message..."
          autoFocus
          maxLength={500}
        />
        <span className='input-hint'>ENTER TO SEND</span>
      </div>
    );
  }
}

export default ChatInput;
