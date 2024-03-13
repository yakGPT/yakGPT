import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { dirPath, id, role, message } = req.body;

  const fileName = `${id}.md`.replace(/\:/g, '-');
  const filePath = path.join(dirPath, fileName);
  const formattedMessage = `**${role}**:\n\n${message}\n\n`;

  // Make sure the '/chats' directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  // Write to the markdown file
  fs.appendFile(filePath, formattedMessage, function (err) {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'Error writing to file' });
    } else {
      console.log(`The message was saved to ${filePath}`);
      res.status(200).json({ message: 'Successfully wrote to file' });
    }
  });
}
