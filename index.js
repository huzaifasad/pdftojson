const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
let fetch;
(async () => {
    const { default: fetchModule } = await import('node-fetch');
    fetch = fetchModule;
})();const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('file');

app.post('/processDiagnosticReport', upload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        const pdfFile = req.file;
        console.log('reached there')
        const extractedText = await extractTextFromPDF(pdfFile);
        console.log(extractedText)
        const texttojson=` ${extractedText}   >>>i want that just convert the   text in the form of the json but valid  json form like
        entity Recognition: Identify and classify relevant entities in the extracted text (e.g., parameters, values, units) i want the perfect to json but the structure is like json i want like clear medical dignostic report clear json`
 
        async function main() {
            console.log('we here')
            const chatCompletion = await openai.chat.completions.create({
              messages: [{ role: 'user', content: texttojson }],
              model: 'gpt-3.5-turbo',
            });
            const responseData = chatCompletion.choices[0].message.content;
            console.log('your json text:', responseData);       
            res.send(responseData)

        
        }
          main()
        
       
          
        console.log('your json text');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function extractTextFromPDF(pdfFile) {
    return new Promise((resolve, reject) => {
        pdfParse(pdfFile.buffer).then(data => {
            if (!data || !data.text) {
                reject(new Error('Failed to extract text from PDF'));
            } else {
                resolve(data.text);
            }
        }).catch(reject);
    });
}

async function processText(text) {
    try {
        const response = await openai.entities({
            documents: [text]
        });

        if (response.data && response.data.length > 0 && response.data[0].entities) {
            const entities = response.data[0].entities;

            const relevantEntities = entities.filter(entity => {
                return entity.type === 'parameter' || entity.type === 'value' || entity.type === 'unit';
            });

            // Construct structured JSON response
            const processedData = {
                parameters: relevantEntities.filter(entity => entity.type === 'parameter').map(entity => entity.text),
                values: relevantEntities.filter(entity => entity.type === 'value').map(entity => entity.text),
                units: relevantEntities.filter(entity => entity.type === 'unit').map(entity => entity.text)
            };

            return processedData;
        } else {
            throw new Error('Invalid response from OpenAI API');
        }
    } catch (error) {
        console.error('Error processing text with OpenAI API:', error.message);
        throw new Error('Error processing text with OpenAI API');
    }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
