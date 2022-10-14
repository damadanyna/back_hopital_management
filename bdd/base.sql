
-- Table Utilisateurs
create table if not exists m_user(
    user_id int auto_increment not null,
    user_label varchar(255) null, -- Medecin Chef
    user_login varchar(255) null, -- chef
    user_pass varchar(255) null, -- 1234
    user_type varchar(10) null, -- "a", "c"
    primary key (user_id)
)Engine=InnoDB;

-- Table d'accès au module
create table if not exists access_user(
    access_id int auto_increment not null,
    access_user_id int null,
    access_module varchar(100) null,
    access_module_id int null,
    primary key (access_id)
)Engine=InnoDB;

-- Liste des modules existants dans l'application
create table if not exists module(
    module_id int auto_increment not null,
    module_label varchar(100) null,
    module_icons varchar(255) null,
    module_description text null,
    primary key (module_id)
)Engine=InnoDB;

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
    hosp_departement varchar(100) null,
    primary key (hosp_id)
)Engine=InnoDB;

