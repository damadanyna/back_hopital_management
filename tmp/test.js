let D = require('../models/data')


const fs = require('fs/promises');

async function example() {
  try {
    const data = await fs.readFile('p.csv', { encoding: 'utf8' });
    console.log(data)

    let r = data.split('\r\n')

    let dispo = ['pat_numero','pat_nom_et_prenom','pat_date_naiss','pat_sexe','pat_profession','pat_adresse','','']

    let data_to_insert = []
    let tmp_d = [], tmp_l = {}

    for (let i = 1; i < r.length-1; i++) {
        tmp_d = r[i].split(';')
        tmp_l = []
        
        for (let j = 0; j < dispo.length; j++) {
            if(dispo[j]){
              if(dispo[j] == 'pat_date_naiss'){
                tmp_l.push((tmp_d[j].trim())?new Date(tmp_d[j].trim()):null) 
              }else{
                tmp_l.push(tmp_d[j].trim())
              }
              
            }
        }

        data_to_insert.push(tmp_l)
    }
    let list_data_n  = Object.keys(data_to_insert[0])
    console.log(data_to_insert)

    let sql = `insert into patient (pat_numero,pat_nom_et_prenom,pat_date_naiss,pat_sexe,pat_profession,pat_adresse) values ?;`

    await D.exec_params(sql,[data_to_insert])

    // //test d'insertion de don
    // for (let i = 0; i < data_to_insert.length; i++) {
    //     await D.set('patient',data_to_insert[i])
    // }

  } catch (err) {
    console.log(err);
  }
}

example();