const defaultHeaders = {
  headers: {
    "Content-Type": "application/json; charset=UTF-8",
  },
};

// GET ALL QUESTIONS BY USERID
export const getMyQuestionsAPIMethod = (currentUserId) => {
  const res = fetch(
    `http://localhost:3001/api/questions/myQuestions/${currentUserId}`,
    {
      ...defaultHeaders,
      method: "GET",
    }
  );
  return res;
};

// CREATING A QUESTION
export const createQuestionAPIMethod = (question) => {
  const response = fetch("http://localhost:3001/api/questions/createQuestion", {
    ...defaultHeaders,
    method: "POST",
    body: JSON.stringify(question),
  });
  return response;
};

/*
// GETTING RECOMMENDATION
 * @param {string|number} age
 * @param {string} description
 * @returns {Promise<Response>}
 */
export function getRecommendationAPIMethod(age, description, allergies) {
  const params = new URLSearchParams({
    age: String(age),
    description: description,
    allergies: allergies
  });
  const url = `http://localhost:3001/run-python?${params.toString()}`;
  console.log("Fetching recommendations from:", url);
  return fetch(url, {
    ...defaultHeaders,
    method: "GET"
  });
}

// UPDATE A QUESTION
export const updateQuestionAPIMethod = (questionId, rec_list) => {
  return fetch(
    `http://localhost:3001/api/questions/updateQuestion/${questionId}`,
    {
      ...defaultHeaders,
      method: "PUT", // The method defaults to GET
      body: JSON.stringify(rec_list),
    }
  );
};

export const getQuestionById = (id) => {
  const res = fetch(
    `http://localhost:3001/api/questions/myQuestion/${id}`,
    {
      ...defaultHeaders,
      method: "GET",
    }
  );
  return res;
};