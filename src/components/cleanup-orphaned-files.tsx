'use client';

import { useEffect } from 'react';

/**
 * Global cleanup component that runs on every page load
 * Cleans up orphaned files from sessionStorage that were uploaded but never submitted
 */
export default function CleanupOrphanedFiles() {
  useEffect(() => {
    // Cleanup orphaned files from sessionStorage
    const cleanupOrphanedFiles = async () => {
      try {
        // Find all sessionStorage keys that start with "application_files_"
        const keysToCheck: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('application_files_')) {
            keysToCheck.push(key);
          }
        }

        if (keysToCheck.length === 0) {
          return;
        }

        console.log('🧹 Global cleanup: Found', keysToCheck.length, 'potential orphaned file sets');

        for (const key of keysToCheck) {
          try {
            const stored = sessionStorage.getItem(key);
            if (!stored) continue;

            const fileIds: string[] = JSON.parse(stored);
            if (!Array.isArray(fileIds) || fileIds.length === 0) {
              sessionStorage.removeItem(key);
              continue;
            }

            console.log(`🧹 Cleaning up orphaned files from ${key}:`, fileIds);

            const token = localStorage.getItem('directus_token') || '';
            if (!token) {
              console.warn('⚠️ No token found, skipping cleanup');
              continue;
            }

            // Delete all files
            const deletePromises = fileIds.map(fileId => {
              return fetch(`/api/upload-document?id=${fileId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              }).then(response => {
                if (response.ok) {
                  console.log(`  ✅ Deleted orphaned file: ${fileId}`);
                } else {
                  console.warn(`  ⚠️ Failed to delete file: ${fileId}`, response.status);
                }
              }).catch(err => {
                console.warn(`  ❌ Error deleting file ${fileId}:`, err);
              });
            });

            await Promise.allSettled(deletePromises);
            
            // Remove from sessionStorage after cleanup
            sessionStorage.removeItem(key);
            console.log(`✅ Cleaned up ${fileIds.length} files from ${key}`);
          } catch (e) {
            console.error(`❌ Error cleaning up ${key}:`, e);
            // Remove invalid entry
            sessionStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error('❌ Error in global cleanup:', error);
      }
    };

    // Run cleanup on mount
    cleanupOrphanedFiles();
  }, []);

  return null; // This component doesn't render anything
}




