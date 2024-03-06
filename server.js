const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;
const API_KEY =
  'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912';

app.get('/:formId/filteredResponses', async (req, res) => {
  const { offset, ...querys } = req.query;
  const formId = req.params.formId;

  try {
    async function fetchAllData() {
      const API = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;
      const { data } = await axios.get(API, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        params: querys,
      });
      const result = {
        responses: data.responses,
        totalResponses: data.totalResponses,
        pageCount: data.pageCount,
      };

      if (data.pageCount > 1) {
        for (let i = 1; i < data.pageCount; i++) {
          const { data } = await axios.get(API, {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
            },
            params: { offset: querys.limit * i, limit: querys.limit },
          });
          result.responses.push(...data.responses);
        }
        return result;
      }
      return result;
    }

    const data = await fetchAllData();
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

    if (querys?.limit) {
      const response = {
        responses: querys?.offset
          ? newData.slice(querys.offset, querys.offset + querys.limit)
          : newData.slice(0, querys.limit),
        totalResponses: newData.length,
        pageCount: querys?.limit
          ? Math.ceil(newData.length / querys?.limit)
          : Math.ceil(newData.length / 150),
      };
      res.json(response);
    } else {
      const response = {
        responses: newData,
        totalResponses: newData.length,
        pageCount: 1,
      };
      res.json(response);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
