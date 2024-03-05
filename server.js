const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const port = 5000;
const API_KEY =
  'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912';

app.get('/:formId/filteredResponses', async (req, res) => {
  try {
    const formId = req.params.formId;
    const API = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;
    const { data } = await axios.get(API, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      params: req.query,
    });

    const filters = JSON.parse(req.query?.filters);

    const newData = data.responses.filter((submission) => {
      return filters.every((filter) => {
        const question = submission.questions.find(
          (question) => question.id === filter.id
        );
        if (filter.id == question.id) {
          switch (filter.condition) {
            case 'equals':
              return question.value == filter.value;
            case 'does_not_equal':
              return question.value !== filter.value;
            case 'greater_than':
              return new Date(question.value) > new Date(filter.value);
            case 'less_than':
              return new Date(question.value) < new Date(filter.value);
            default:
              return false;
          }
        }
      });
    });
    const response = {
      responses: newData,
      totalResponses: newData.length,
      pageCount: 1,
    };
    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
