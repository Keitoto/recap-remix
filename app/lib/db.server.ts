import mongodb from '~/lib/mongodb.server';
import type { Item, TodoActions, User } from '~/types';
import * as crypto from 'crypto';
import { ObjectId } from 'mongodb';

if (!process.env.MONGODB_DBNAME) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_DBNAME"');
}
if (!process.env.MONGODB_COLL_USERS) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_COLL_USERS"');
}

const dbName = process.env.MONGODB_DBNAME;
const collUsers = process.env.MONGODB_COLL_USERS;

export const todos: TodoActions = {
  async create(userId, description) {
    try {
      const client = await mongodb();
      const collection = client.db(dbName).collection<User>(collUsers);

      const user = await collection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return undefined;
      }

      const createdTodo: Item = {
        id: crypto.randomBytes(16).toString('hex'),
        description,
        isCompleted: false,
        createdAt: new Date(),
        completedAt: undefined,
        isEditing: false,
      };

      await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $push: { tasks: createdTodo } }
      );

      return createdTodo;
    } catch (error) {
      console.error('Error creating task:', error);
      return undefined;
    }
  },

  async read(userId) {
    try {
      const client = await mongodb();
      const collection = client.db(dbName).collection<User>(collUsers);

      const user = await collection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return undefined;
      }

      return user.tasks;
    } catch (error) {
      console.error('Error reading task:', error);
      return undefined;
    }
  },

  async update(userId, todoId, fields) {
    try {
      const client = await mongodb();
      const collection = client.db(dbName).collection<User>(collUsers);

      const user = await collection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return undefined;
      }

      let updatedTodo = user.tasks.find((task) => todoId === task.id);
      if (!updatedTodo) {
        return undefined;
      }

      updatedTodo = {
        ...updatedTodo,
        ...fields,
        completedAt: fields.isCompleted ? fields.completedAt : undefined,
      };

      await collection.updateOne(
        { _id: new ObjectId(userId), 'tasks.id': todoId },
        {
          $set: {
            'tasks.$': updatedTodo,
          },
        }
      );

      return updatedTodo;
    } catch (error) {
      console.error('Error updating task:', error);
      return undefined;
    }
  },

  async delete(userId, todoId) {
    try {
      const client = await mongodb();
      const collection = client.db(dbName).collection<User>(collUsers);

      const user = await collection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return undefined;
      }

      const deletedTodo = user.tasks.find((task) => todoId === task.id);
      if (!deletedTodo) {
        return undefined;
      }

      await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { tasks: { id: todoId } } }
      );

      return deletedTodo;
    } catch (error) {
      console.error('Error deleting task:', error);
      return undefined;
    }
  },

  async clearCompleted(userId) {
    try {
      const client = await mongodb();
      const collection = client.db(dbName).collection<User>(collUsers);

      const user = await collection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return undefined;
      }

      await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { tasks: { isCompleted: true } } }
      );

      return user.tasks.filter((task) => !task.isCompleted);
    } catch (error) {
      console.error('Error clearing completed tasks:', error);
      return undefined;
    }
  },

  async deleteAll(userId) {
    try {
      const client = await mongodb();
      const collection = client.db(dbName).collection<User>(collUsers);

      const user = await collection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return undefined;
      }

      await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { tasks: [] } }
      );

      return [];
    } catch (error) {
      console.error('Error deleting all tasks:', error);
      return undefined;
    }
  },
};

export const createUser = async (
  name: string,
  email: string,
  password: string
) => {
  try {
    const client = await mongodb();
    const collection = client.db(dbName).collection<User>(collUsers);

    const user = await collection.findOne({ email });
    if (user) {
      return {
        error: 'The email address already exists.',
        data: null,
      };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex');

    const { insertedId } = await collection.insertOne({
      createdAt: new Date(),
      name,
      email,
      password: { salt, hash },
      tasks: [],
    });

    return { error: null, data: insertedId.toString() };
  } catch (error) {
    return { error: 'An unexpected error occured.', data: null };
  }
};

export const getUser = async (id: string) => {
  try {
    const client = await mongodb();
    const collection = client.db(dbName).collection<User>(collUsers);

    const user = await collection.findOne({
      _id: ObjectId.createFromHexString(id),
    });
    if (!user) {
      return { error: 'User not found.', data: null };
    }

    return { error: null, data: user };
  } catch (error) {
    return { error: 'An unexpected error occured.', data: null };
  }
};

export const authenticateUser = async (email: string, password: string) => {
  try {
    const client = await mongodb();
    const collection = client.db(dbName).collection<User>(collUsers);

    const user = await collection.findOne({ email });

    if (!user) return { error: 'Incorrect email or password.', data: null };

    const hash = crypto
      .pbkdf2Sync(password, user.password.salt, 100000, 64, 'sha512')
      .toString('hex');

    if (hash !== user.password.hash) {
      return { error: 'Incorrect email or password.', data: null };
    }

    return { error: null, data: user._id.toString() };
  } catch (error) {
    return { error: 'An unexpected error occurred.', data: null };
  }
};

export const initiatePasswordReset = async (email: string) => {
  try {
    const client = await mongodb();
    const collection = client.db(dbName).collection<User>(collUsers);

    const user = await collection.findOne({ email });
    // If the user is not found, return a generic error message.
    // This prevents revealing whether an account associated with the email exists.
    if (!user) {
      return {
        error:
          'If an account exists for this email, a password reset link will be sent.',
        data: null,
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    await collection.updateOne(
      { email },
      {
        $set: {
          forgotPasswordToken: token,
          forgotPasswordTokenExpireAt: Date.now() + 1000 * 60 * 60, // 1 hr
        },
      }
    );

    return { error: null, data: token };
  } catch (error) {
    return { error: 'An unexpected error occured.', data: null };
  }
};

export const updatePassword = async (token: string, password: string) => {
  try {
    const client = await mongodb();
    const collection = client.db(dbName).collection<User>(collUsers);

    const user = await collection.findOne({ forgotPasswordToken: token });
    if (!user) {
      return { error: 'Token is not valid.', data: null };
    }
    if (Date.now() > (user.forgotPasswordTokenExpireAt ?? 0)) {
      return { error: 'Token has expired.', data: null };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex');

    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: { salt, hash },
        },
        $unset: {
          forgotPasswordToken: '',
          forgotPasswordTokenExpiryDate: '',
        },
      }
    );

    return { error: null, data: user._id.toString() };
  } catch (error) {
    return { error: 'An unexpected error occured.', data: null };
  }
};

export const deleteUser = async (id:string) => {
  try {
    const client = await mongodb();
    const collection = client.db(dbName).collection<User>(collUsers);
 
    const user = await collection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return { error: "User not found.", data: null };
    }
 
    await collection.deleteOne({ _id: new ObjectId(id) });
 
    return { error: null, data: "User deleted successfully." };
  } catch (error) {
    return { error: "An unexpected error occured.", data: null };
  }
}