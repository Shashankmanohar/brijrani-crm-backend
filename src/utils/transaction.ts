import mongoose, { ClientSession } from 'mongoose';

export const runInTransaction = async <T>(
  fn: (session?: ClientSession) => Promise<T>
): Promise<T> => {
  let session: ClientSession | undefined;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (err: any) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {}
      session.endSession();
    }
    
    // Check if error is due to MongoDB standalone (no replica set) setup
    if (err.message && err.message.includes('Transaction numbers are only allowed')) {
      return await fn(undefined);
    }
    throw err;
  }
};
