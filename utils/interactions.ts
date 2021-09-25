import { deploy } from "../deps.ts";

export const noop = {
  type: deploy.InteractionResponseType.DEFERRED_MESSAGE_UPDATE,
};
