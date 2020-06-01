const fs = require('fs');
let months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
for (let i = 0; i < months.length; i++) {
  try {
    fs.mkdirSync('./blog/api/data/post/2019/'+ months[i])
  } catch (err) {
   return console.log(err)
  }
}
