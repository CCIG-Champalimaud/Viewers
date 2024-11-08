const fs = require('fs').promises
const path = require('path')

async function clearAndMoveFolder(folderA, folderB) {
    try {
        // Check if folderB exists, and if so, remove all its contents
        try {
            await fs.access(folderB)
            const files = await fs.readdir(folderB)
            for (const file of files) {
                const filePath = path.join(folderB, file)
                await fs.rm(filePath, { recursive: true, force: true })
            }
        } catch (err) {
            // If folderB does not exist, create it
            if (err.code === 'ENOENT') {
                await fs.mkdir(folderB, { recursive: true })
            } else {
                throw err
            }
        }

        // Read contents of folderA
        const files = await fs.readdir(folderA)
        for (const file of files) {
            const srcPath = path.join(folderA, file)
            const destPath = path.join(folderB, file)
            await fs.rename(srcPath, destPath)
        }

        console.log(`Moved all contents from ${folderA} to ${folderB} successfully`)
    } catch (error) {
        console.error('Error:', error)
    }
}


// Get folder paths from command-line arguments
const [folderA, folderB] = process.argv.slice(2)

if (!folderA || !folderB) {
    console.error('Please provide both source and destination folder paths')
    process.exit(1)
}

clearAndMoveFolder(folderA, folderB)
