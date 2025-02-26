import { ObjectId } from 'mongodb';

export interface Item {
  id: string;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  isEditing?: boolean;
}

export interface TodoActions {
  create: (userId: string, description: string) => Promise<Item | undefined>;
  read: (userId: string) => Promise<Item[] | undefined>;
  update: (
    userId: string,
    todoId: string,
    fields: Partial<Omit<Item, 'id' | 'createdAd'>>
  ) => Promise<Item | undefined>;
  delete: (userId: string, todoId: string) => Promise<Item | undefined>;
  clearCompleted: (userId: string) => Promise<Item[] | undefined>;
  deleteAll: (userId: string) => Promise<Item[] | undefined>;
}

export type View = 'all' | 'active' | 'completed';

export type Theme = 'system' | 'light' | 'dark';

export interface User {
  /**
   * Unique identifier for the user in the database.
   * This field is optional because it should be left out when creating a new user,
   * allowing the MongoDB driver to automatically generate it.
   */
  _id?: ObjectId;

  /**
   * The date and time when the user account was created.
   */
  createdAt: Date;

  /**
   * The user's full name.
   */
  name: string;

  /**
   * The user's email address.
   */
  email: string;

  /**
   * The user's password details, including the salt and hash for secure storage.
   */
  password: {
    /**
     * Salt used in hashing the user's password.
     */
    salt: string;

    /**
     * Hash of the user's password.
     */
    hash: string;
  };

  /**
   * List of tasks associated with the user.
   */
  tasks: Item[];

  /**
   * Token for resetting the user's password. This field is optional and is only present if a password reset was requested.
   */
  forgotPasswordToken?: string;

  /**
   * The expiration timestamp for the password reset token, in milliseconds since the Unix epoch. This field is optional.
   */
  forgotPasswordTokenExpireAt?: number;
}
