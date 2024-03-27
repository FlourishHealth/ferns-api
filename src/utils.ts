import {ObjectId} from "mongodb";

// A better version of mongoose's ObjectId.isValid,
// which falsely will say any 12 character string is valid.
export function isValidObjectId(id: string): boolean {
  try {
    return new ObjectId(id).toString() === id;
  } catch (error) {
    return false;
  }
}

export const timeout = async (ms: number): Promise<NodeJS.Timeout> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
