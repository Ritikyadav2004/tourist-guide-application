import {
  CHAT_REQUEST,
  CHAT_SUCCESS,
  CHAT_FAIL,
  MY_CHATS_REQUEST,
  MY_CHATS_SUCCESS,
  MY_CHATS_FAIL,
  MESSAGES_REQUEST,
  MESSAGES_SUCCESS,
  MESSAGES_FAIL,
  SEND_MESSAGE_REQUEST,
  SEND_MESSAGE_SUCCESS,
  SEND_MESSAGE_FAIL,
  UNREAD_COUNT_REQUEST,
  UNREAD_COUNT_SUCCESS,
  UNREAD_COUNT_FAIL,
  CLEAR_CHAT_ERROR,
} from "../constants/chatConstants";

const initialState = {
  loading: false,
  chats: [],
  messages: [],
  currentChat: null,
  unreadCount: 0,
  error: null,
  success: false,
};

export const chatReducer = (state = initialState, action) => {
  switch (action.type) {
    case CHAT_REQUEST:
    case MY_CHATS_REQUEST:
    case MESSAGES_REQUEST:
    case SEND_MESSAGE_REQUEST:
    case UNREAD_COUNT_REQUEST:
      return { ...state, loading: true, error: null, success: false };

    case CHAT_SUCCESS:
    case SEND_MESSAGE_SUCCESS:
      return { ...state, loading: false, success: true, error: null };

    case MY_CHATS_SUCCESS:
      return { ...state, loading: false, chats: action.payload, error: null };

    case MESSAGES_SUCCESS:
      return { ...state, loading: false, messages: action.payload, error: null };

    case UNREAD_COUNT_SUCCESS:
      return { ...state, loading: false, unreadCount: action.payload.count, error: null };

    case CHAT_FAIL:
    case MY_CHATS_FAIL:
    case MESSAGES_FAIL:
    case SEND_MESSAGE_FAIL:
    case UNREAD_COUNT_FAIL:
      return { ...state, loading: false, error: action.payload, success: false };

    case CLEAR_CHAT_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};
