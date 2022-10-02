

-- Table patient
create table if not exists patient(
    patient_id int auto_increment not null,
    patient_num varchar(255) null,
    patient_name_and_lastname varchar(255) null,
    patient_name varchar(255) null,
    patient_lastname varchar(255) null,
    patient_date_naiss datetime null,
    patient_casier varchar(255) null,
    patient_age int null,
    patient_sexe varchar(255),
    patient_dern_visite datetime null,
    patient_date_retour datetime null,
    patient_profession varchar(255) null,
    patient_adresse varchar(255) null,
    patient_note varchar(255) null,
    primary key (patient_id)
)Engine=InnoDB;

-- Table hospitalisation
create table if not exists hospitalisation(
    hosp_id int auto_increment not null,
    hosp_ref varchar(255) null,
    hosp_patient_num varchar(255) null,
    hosp_patient_name_and_lastname varchar(255),
    hosp_entree datetime null default NOW(),
    hosp_paye varchar(255) null,
    hosp_montant varchar(255) null,
    hosp_restant varchar(255) null,
    hosp_sortie datetime null,
    hosp_departement int null,
    primary key (hosp_id)
)Engine=InnoDB;