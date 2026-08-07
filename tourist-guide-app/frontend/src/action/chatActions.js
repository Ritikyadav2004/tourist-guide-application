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
import {
  getMyChats,
  getOrCreateGuideChat,
  getChatMessages,
  sendChatMessage,
  getUnreadChatCount,
} from "../services/api";

// Get or Create Chat with Guide
export const getOrCreateChatAction = (guideId) => async (dispatch) => {
  try {
    dispatch({ type: CHAT_REQUEST });
    const data = await getOrCreateGuideChat(guideId);
    dispatch({ type: CHAT_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: CHAT_FAIL, payload: error.message });
    throw error;
  }
};

// Get My Chats
export const getMyChatsAction = () => async (dispatch) => {
  try {
    dispatch({ type: MY_CHATS_REQUEST });
    const data = await getMyChats();
    dispatch({ type: MY_CHATS_SUCCESS, payload: data.chats || data });
  } catch (error) {
    dispatch({ type: MY_CHATS_FAIL, payload: error.message });
  }
};

// Get Chat Messages
export const getChatMessagesAction = (chatId, pagination) => async (dispatch) => {
  try {
    dispatch({ type: MESSAGES_REQUEST });
    const data = await getChatMessages(chatId, pagination);
    dispatch({ type: MESSAGES_SUCCESS, payload: data.messages || data });
  } catch (error) {
    dispatch({ type: MESSAGES_FAIL, payload: error.message });
  }
};

// Send Message
export const sendMessageAction = (messageData) => async (dispatch) => {
  try {
    dispatch({ type: SEND_MESSAGE_REQUEST });
    const data = await sendChatMessage(messageData);
    dispatch({ type: SEND_MESSAGE_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: SEND_MESSAGE_FAIL, payload: error.message });
    throw error;
  }
};

// Get Unread Count
export const getUnreadCountAction = () => async (dispatch) => {
  try {
    dispatch({ type: UNREAD_COUNT_REQUEST });
    const data = await getUnreadChatCount();
    dispatch({ type: UNREAD_COUNT_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: UNREAD_COUNT_FAIL, payload: error.message });
  }
};

// Clear Chat Error
export const clearChatError = () => (dispatch) => {
  dispatch({ type: CLEAR_CHAT_ERROR });
};
