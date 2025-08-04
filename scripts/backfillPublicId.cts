const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('../models/Book').default;

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Extracts the Cloudinary public_id from a book file URL.
 * Assumes the format: .../book-files/public_id.extension
 * @param url The full Cloudinary file URL.
 * @returns The extracted public_id or null if not found.
 */
const extractPublicIdFromUrl = (url: string): string | null => {
  if (!url) return null;

  // This regex looks for the content between "book-files/" and the file extension.
  const regex = /\/book-files\/(.+?)(?:\.pdf|\.epub|$)/;
  const match = url.match(regex);

  // The public_id is in the first capturing group (index 1)
  return match ? match[1] : null;
};

const runBackfill = async () => {
  const dbUri = process.env.MONGODB_URI;

  if (!dbUri) {
    console.error('Error: MONGODB_URI is not defined in your environment variables.');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);
    console.log('Database connected successfully.');

    // Find all books where filePublicId does not exist or is null
    const booksToUpdate = await Book.find({
      $or: [
        { filePublicId: { $exists: false } },
        { filePublicId: null },
        { filePublicId: '' }
      ]
    });

    if (booksToUpdate.length === 0) {
      console.log('All books already have a filePublicId. No action needed.');
      return;
    }

    console.log(`Found ${booksToUpdate.length} book(s) to update.`);

    const updatePromises: Promise<any>[] = [];

    for (const book of booksToUpdate) {
      console.log(`\nProcessing book: "${book.title}" (ID: ${book._id})`);
      const publicId = extractPublicIdFromUrl(book.fileUrl);

      if (publicId) {
        console.log(`  -> Extracted publicId: "${publicId}"`);
        book.filePublicId = publicId;
        // Add the save operation to our list of promises
        updatePromises.push(book.save());
        console.log(`  -> Queued for update.`);
      } else {
        console.warn(`  -> WARNING: Could not extract publicId from URL: ${book.fileUrl}`);
      }
    }

    // Execute all the update operations in parallel
    if (updatePromises.length > 0) {
        console.log(`\nSaving ${updatePromises.length} updates to the database...`);
        await Promise.all(updatePromises);
        console.log('All updates completed successfully!');
    }


  } catch (error) {
    console.error('\nAn error occurred during the backfill process:', error);
  } finally {
    // Ensure we disconnect from the database
    await mongoose.disconnect();
    console.log('\nDatabase connection closed.');
  }
};


// Execute the script
// IMPORTANT: Always back up your database before running a migration script.
console.log('--- Starting filePublicId Backfill Script ---');
runBackfill();