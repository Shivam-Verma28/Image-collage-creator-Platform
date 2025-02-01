document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData();
    const files = document.getElementById('imageInput').files;
    
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);  // Append all selected images
    }

    try {
        // Upload images to backend
        let uploadResponse = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData
        });

        let uploadResult = await uploadResponse.json();
        if (!uploadResult.success) throw new Error('Upload failed');

        // Generate collage
        let collageResponse = await fetch('http://localhost:5000/collage', {
            method: 'POST'
        });

        let collageResult = await collageResponse.json();
        if (!collageResult.success) throw new Error('Collage generation failed');

        // Display collage image
        document.getElementById('collageImage').src = `http://localhost:5000/${collageResult.collage}`;

    } catch (error) {
        console.error('Error:', error);
    }
});
