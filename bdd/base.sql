
-- Table Utilisateurs
create table if not exists user(
    user_id int auto_increment not null,
    user_label varchar(255) null, -- Medecin Chef
    user_login varchar(255) null, -- chef
    user_pass varchar(255) null, -- 1234
    user_type varchar(10) null, -- "a", "c"
    primary key (patient_id)
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

-- Prep encaissement
create table if not exists prep_encaissement(
    p_enc_id int auto_increment not null,
    p_enc_date_mvt datetime null,
    p_enc_heure datetime null,
    p_enc_departement varchar(255) null,
    p_enc_patient_id int null,
    p_enc_patient_name_and_lastname varchar(255) null,
    p_enc_type_paiment varchar(255) null,
    p_enc_designation varchar(255) null,
    p_enc_montant varchar(255) null,
    p_enc_total varchar(255) null,
    primary key (p_enc_id)
)Engine=InnoDB;

-- Table Versement
create table if not exists versement(
    vers_id int auto_increment not null,
    vers_date datetime null,
    vers_fond_caisse_matin varchar(255) null,
    vers_recette_espece int null,
    vers_rembourse int null,
    vers_departement varchar(255) null,
    primary key (vers_id)
)Engine=InnoDB;

-- Table billetage_espece
create table if not exists billetage_espece(
    b_esp_id int auto_increment not nul,
    b_esp_nbr int null,
    b_esp_billet varchar(255) null,
    b_esp_montant int null,
    b_esp_total_espece varchar(255),
    b_esp_fond_caisse_soir varchar(255),
    b_esp_total_cheque varchar(255),
    b_esp_total_versement varchar(255),
    b_esp_observation varchar(255),
    primary key (b_esp_id)
)Engine=InnoDB;

-- Table recapitulation departemement
create table if not exists recapitulation_departement (
    rec_dep_id int auto_increment not null,
    rec_dep_designation varchar(255) null,
    rec_dep_chirurgie varchar(255) null,
    rec_dep_maternite varchar(255) null,
    rec_dep_nb int null,
    rec_dep_brm varchar(255) null,
    rec_dep_brc varchar(255) null,
    rec_dep_centreclinique varchar(255) null,
    rec_dep_pf varchar(255) null,
    rec_dep_dispensaire varchar(255) null,
    rec_dep_total int null,
    primary key (rec_dep_id)
)Engine=InnoDB;
