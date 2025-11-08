// Wait for CMS to be ready before registering event listeners
(function() {
  // Check if CMS is available
  if (typeof CMS === 'undefined') {
    console.error('CMS not loaded yet, retrying...');
    setTimeout(arguments.callee, 100);
    return;
  }

  // Custom widget to auto-fill image dimensions
  CMS.registerEventListener({
    name: 'preSave',
    handler: ({ entry }) => {
      return new Promise((resolve) => {
        const data = entry.get('data');
        const fullImageUrl = data.get('full');
        const dimensions = data.get('dimensions');

        // Only process if image exists and dimensions not already set
        if (fullImageUrl && !dimensions) {
          const img = new Image();

          img.onload = () => {
            const newDimensions = `${img.width}x${img.height}`;
            const updatedData = data.set('dimensions', newDimensions);
            const updatedEntry = entry.set('data', updatedData);

            console.log(`✓ Auto-detected dimensions: ${newDimensions}`);
            resolve(updatedEntry);
          };

          img.onerror = () => {
            console.warn('Could not load image to detect dimensions');
            resolve(entry);
          };

          // Handle both absolute URLs and relative paths
          if (fullImageUrl.startsWith('http')) {
            img.src = fullImageUrl;
          } else {
            img.src = window.location.origin + fullImageUrl;
          }
        } else {
          resolve(entry);
        }
      });
    },
  });

  // Auto-generate thumbnail URL based on full image
  CMS.registerEventListener({
    name: 'preSave',
    handler: ({ entry }) => {
      const data = entry.get('data');
      const fullImageUrl = data.get('full');
      const thumb = data.get('thumb');

      // If no thumbnail is set, use the full image
      // (Frontend will handle resizing via Cloudflare or CSS)
      if (fullImageUrl && !thumb) {
        const updatedData = data.set('thumb', fullImageUrl);
        const updatedEntry = entry.set('data', updatedData);
        return updatedEntry;
      }

      return entry;
    },
  });

  console.log('✓ Custom CMS widgets loaded');
})();
