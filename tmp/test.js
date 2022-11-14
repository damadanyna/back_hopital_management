let D = require('../models/data')


const fs = require('fs/promises');

async function example() {
  try {
    const data = await fs.readFile('c.csv', { encoding: 'utf8' });
    console.log(data)

    let r = data.split('\r\n')

    let dispo = ['art_code','art_label','','art_unite_stk','','','art_conditionnement']

    let data_to_insert = []
    let tmp_d = [], tmp_l = {}

    for (let i = 0; i < r.length; i++) {
        tmp_d = r[i].split(';')
        tmp_l = {}
        
        for (let j = 0; j < dispo.length; j++) {
            if(dispo[j]){
              tmp_l[dispo[j]] = tmp_d[j].trim()
              tmp_l['art_parent_cat_id'] = 9
              tmp_l['art_cat_id'] = 59
            }
        }

        data_to_insert.push(tmp_l)
    }
    let list_data_n  = Object.keys(data_to_insert[0])
    console.log(data_to_insert)

    //test d'insertion de don
    for (let i = 0; i < data_to_insert.length; i++) {
        await D.set('article',data_to_insert[i])
    }

  } catch (err) {
    console.log(err);
  }
}

example();