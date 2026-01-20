import type { MessageInstance } from "antd/es/message/interface";
import type { NotificationInstance } from "antd/es/notification/interface";

export interface AppContext {
    message: MessageInstance | null;
    notification: NotificationInstance | null;
}

export const appContext: AppContext = {
    message: null,
    notification: null
}
