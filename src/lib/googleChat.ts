export interface GoogleChatSpace {
  name: string; // "spaces/AAA..."
  type: string;
  displayName?: string;
  spaceThreadingState?: string;
  spaceType?: string;
  description?: string;
}

export interface GoogleChatMessage {
  name: string; // "spaces/AAA/messages/BBB"
  text?: string;
  sender?: {
    name: string;
    displayName: string;
    type: string;
    avatarUrl?: string;
  };
  createTime: string;
  formattedText?: string;
}

export async function fetchGoogleChatSpaces(accessToken: string): Promise<GoogleChatSpace[]> {
  try {
    const res = await fetch('https://chat.googleapis.com/v1/spaces', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return data.spaces || [];
  } catch (error: any) {
    console.error('Failed to fetch Google Chat spaces:', error);
    throw error;
  }
}

export async function fetchGoogleChatMessages(accessToken: string, spaceName: string): Promise<GoogleChatMessage[]> {
  try {
    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=25`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return (data.messages || []).reverse();
  } catch (error: any) {
    console.error(`Failed to fetch messages for ${spaceName}:`, error);
    throw error;
  }
}

export async function sendGoogleChatMessage(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<GoogleChatMessage> {
  try {
    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP error ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('Failed to send Google Chat message:', error);
    throw error;
  }
}
