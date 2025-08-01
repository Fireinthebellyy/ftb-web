import { Client, Storage } from "appwrite";

export function createOpportunityStorage() {
  const client = new Client();
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
    .setProject(
      process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITY_PROJECT_ID as string
    );

  return new Storage(client);
}

export function createAvatarStorage() {
  const client = new Client();
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
    .setProject(
      process.env.NEXT_PUBLIC_APPWRITE_USR_AVATAR_PROJECT_ID as string
    );

  return new Storage(client);
}
