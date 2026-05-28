import React, { Component } from 'react';
import './Message.scss';

class Message extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parsed: null,
      parseError: false,
    };
  }

  componentDidMount() {
    this.parseMessage();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.message !== this.props.message) {
      this.parseMessage();
    }
  }

  parseMessage() {
    try {
      if (!this.props.message) {
        this.setState({ parseError: true });
        return;
      }

      // The backend wraps every message as {type, body}.
      // For user messages, body is itself a JSON string: {body, user}.
      // For system messages, body is plain text (e.g. "New User Joined...").
      const outer = JSON.parse(this.props.message);

      if (outer.body !== undefined) {
        try {
          const inner = JSON.parse(outer.body);
          // Inner JSON is a user message when it has a 'body' field.
          if (inner && inner.body !== undefined) {
            this.setState({ parsed: inner, parseError: false });
            return;
          }
        } catch (e) {
          // body is plain text — fall through to system message handling.
        }
        // System / server message: expose the plain-text body with no user.
        this.setState({
          parsed: { body: String(outer.body), user: null },
          parseError: false,
        });
      } else {
        this.setState({ parsed: outer, parseError: false });
      }
    } catch (e) {
      // Completely unparseable — show as-is.
      this.setState({
        parsed: { body: this.props.message, user: null },
        parseError: false,
      });
    }
  }

  render() {
    const { parsed, parseError } = this.state;
    // currentUser lets us mark our own messages as 'me'.
    const { currentUser, timestamp } = this.props;

    if (parseError || !parsed) {
      return (
        <div className="Message system">
          <div className="msg-bubble">
            <span className="msg-body">[Unreadable transmission]</span>
          </div>
        </div>
      );
    }

    const isSystem = !parsed.user;
    // Fix: CSS classes must match SCSS — 'me' / 'other', NOT 'mine' / 'theirs'.
    const isOwn = !isSystem && parsed.user === currentUser;
    const timeStr = timestamp
      ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    if (isSystem) {
      // Fix: system messages must be wrapped in .msg-bubble so SCSS rules apply.
      return (
        <div className="Message system">
          <div className="msg-bubble">
            <span className="msg-body">{parsed.body}</span>
          </div>
        </div>
      );
    }

    return (
      // Fix: was 'mine' / 'theirs' — SCSS defines '.me' / '.other'.
      <div className={`Message ${isOwn ? 'me' : 'other'}`}>
        <div className="msg-meta">
          {!isOwn && <span className="msg-author">◈ {parsed.user}</span>}
          {timeStr && <span className="msg-time">{timeStr}</span>}
        </div>
        <div className="msg-bubble">
          <span className="msg-body">{parsed.body}</span>
        </div>
      </div>
    );
  }
}

export default Message;
