
-- Table Utilisateurs
create table if not exists utilisateur(
    util_id int auto_increment not null,
    util_label varchar(100) null, -- Medecin Chef
    util_login varchar(150) null, -- chef
    util_mdp varchar(255) null, -- 1234
    util_type varchar(10) null, -- "a", "c"
    util_date_enreg datetime null default NOW(), -- "a", "c"
    primary key (util_id)
)Engine=InnoDB;


-- Table Visite
create table if not exists visite(
    visite_id int auto_increment not null, 
    pat_id int null,
    visite_date datetime null,
    viste_date_enreg datetime null default NOW(), 
    primary key (visite_id)
)Engine=InnoDB;

-- Gestion module utilisateur
create table if not exists util_access(
    ua_id int auto_increment not null,
    ua_util_id int null,
    ua_module_id int null,
    primary key (ua_id)
)Engine=InnoDB;

create table if not exists module(
    module_id int auto_increment not null, 
    module_label varchar(100) null,
    base_link varchar(50) null,
    primary key (module_id)
)Engine=InnoDB;

-- Table Patient
create table if not exists patient(
    pat_id int auto_increment not null, 
    pat_nom_et_prenom varchar(150) null,
    pat_date_naiss datetime null,
    pat_date_enreg datetime null default NOW(), 
    pat_adresse varchar(100) null, 
    pat_profession varchar(50) null,  
    pat_sexe varchar(5) null,
    pat_numero varchar(20) null, 
    pat_util_id int null,
    primary key (pat_id)
)Engine=InnoDB;
 

-- Table Entreprise
create table if not exists entreprise(
    ent_id int auto_increment not null, 
    ent_num_compte varchar(50) null, 
    ent_label varchar(50) null, 
    ent_code varchar(50) null, 
    ent_pat_percent varchar(50),
    ent_soc_percent varchar(50),
    ent_adresse varchar(50) null, 
    ent_date_enreg datetime null default NOW(),
    ent_util_id int null,
    primary key (ent_id)
)Engine=InnoDB; 
 

-- Table Payement
create table if not exists payement(
    pai_id int auto_increment not null, 
    pai_label varchar(50) null, 
    pai_date_enreg datetime null default NOW(),
    pai_util_id int null,
    primary key (pai_id)
)Engine=InnoDB; 
 

-- Table Service
create table if not exists service(
    service_id int auto_increment not null, 
    service_label varchar(50) null,
    service_parent_id int null,
    service_date_enreg datetime null default NOW(),  
    service_util_id int null,
    primary key (service_id)
)Engine=InnoDB; 

-- NB: asina valuer boolean ao amin'ny (Détail service) mba halalana fa enregistré na tsia ilay service
-- Raha eny dia afaka manao enregistrement hafa hoanio patient io
-- Raha tsia dia mahazo notification ny médecin chef hoe misy service izay enregistré nefa tsy mbola enregistré ao amin'ny caisse

-- Table Détail
create table if not exists detail(
    detail_id int auto_increment not null, 
    service_id int not null, 
    detail_label varchar(50) null, 
    detail_nombre varchar(50) null,
    detail_p_u int null,
    pat_id int not null,
    caisse_id int not null,
    is_save boolean not null,
    detail_date_enreg datetime null default NOW(),
    primary key (detail_id)
)Engine=InnoDB; 
 

-- Table Tarif
create table if not exists tarif(
    tarif_id int auto_increment not null, 
    tarif_label varchar(50) null,
    tarif_date_enreg datetime null default NOW(),
    tarif_util_id int null,
    primary key (tarif_id)
)Engine=InnoDB; 
 

-- Table Departement
create table if not exists departement(
    dep_id int auto_increment not null, 
    dep_label varchar(50) null, 
    dep_code varchar(100) null,
    dep_date_enreg datetime null default NOW(),
    dep_util_id int null,
    primary key (dep_id)
)Engine=InnoDB; 
 

-- Table Hospitalisation
create table if not exists hospitalisation(
    hosp_id int auto_increment not null, 
    util_id int not null,
    dep_id int not null,
    ent_id int not null,
    tarif_id int not null,
    pat_id int not null, 
    hosp_total_payer int null, 
    hosp_total_avancer int null, 
    hosp_rest_apayer int null, 
    hosp_date_entrer datetime null,
    hosp_date_sorti datetime null,
    hosp_date_enreg datetime null default NOW(),
    hosp_util_id int null,
    primary key (hosp_id)
)Engine=InnoDB; 
 

-- Table versement
create table if not exists versement(
    versmnt_id int auto_increment not null,  
    versmnt_date_versement datetime null,
    dep_id int not null, 
    versmnt_font_caisse int null,
    versmnt_recette_esp int null,
    versmnt_recette_total int null,
    versmnt_total_cheque int null,
    versmnt_total_versement int null,  
    versmnt_rembourser int null,
    versmnt_date_enreg datetime null default NOW(),
    versmnt_util_id int null,
    primary key (versmnt_id)
)Engine=InnoDB; 
 
-- mardi 25 oct 2022
-- Table fournisseur
create table if not exists fournisseur(
    fourn_id int auto_increment not null, 
    fourn_label varchar(50) null, 
    fourn_date_enreg datetime null default NOW(),
    fourn_adresse varchar(70) not null,
    fourn_code varchar(100) not null,
    fourn_nif varchar(70) not null,
    fourn_stat varchar(70) not null,
    fourn_info varchar(250) not null,
    fourn_tva int not null,
    founr_util_id int null,
    primary key (fourn_id)
)Engine=InnoDB; 
 

-- Table categorie_article
create table if not exists categorie_article(
    cat_id int auto_increment not null, 
    cat_parent_id int null,
    cat_label varchar(50) null, 
    cat_date_enreg datetime null default NOW(),
    cat_code varchar(50) null, 
    primary key (cat_id)
)Engine=InnoDB; 
 

-- Table article
create table if not exists article(
    art_id int auto_increment not null, 
    art_parent_cat_id int not null,
    art_cat_id int not null,
    art_code varchar(100) null, 
    art_fourn_id int null, 
    art_date_enreg datetime null default NOW(),
    art_label varchar(100) null, 
    art_unite_stk varchar(50) null,
    art_conditionnement varchar(50),
    art_emplacement varchar(255),
    art_prix_unitaire varchar(255),
    art_prix_revient varchar(255),
    art_stk_mini int null,
    art_util_id int null,
    primary key (art_id)
)Engine=InnoDB; 
 

-- Table depot
create table if not exists depot(
    depot_id int auto_increment not null, 
    depot_code varchar(50) null,
    depot_label varchar(50) null,
    depot_date_enreg datetime null default NOW(),
    depot_util_id int null,
    primary key (depot_id)
)Engine=InnoDB; 
 

-- Table stock_article
create table if not exists stock_article(
    stk_id int auto_increment not null, 
    stk_depot_id int not null,
    stk_art_id int not null, 
    stk_initial int null,
    stk_actuel int null,
    stk_article_date_enreg datetime null default NOW(), 
    primary key (stk_id)
)Engine=InnoDB; 
 

-- Table encharge
create table if not exists encharge(
    encharge_id int auto_increment not null, 
    encharge_pat_id int null,
    encharge_tarif_id int null, 
    encharge_ent_id int null,
    encharge_seq varchar(50) null,
    encharge_date_entre datetime null default NOW(), 
    encharge_date_sortie datetime null,
    encharge_ent_payeur int null, 
    encharge_date_enreg datetime null default NOW(), 
    encharge_util_id int null,
    primary key (encharge_id)
)Engine=InnoDB; 
 

-- Table consultation
create table if not exists consultation(
    cons_id int auto_increment not null, 
    cons_pat_id int null, 
    cons_ent_id int null, 
    cons_num_dossier int null, 
    cons_code int null, 
    cons_montant int null, 
    cons_date_enreg datetime null default NOW(), 
    cons_montant_calc int null,
    cons_medcin varchar(200), 
    cons_util_id int null,
    primary key (cons_id)
)Engine=InnoDB; 
 
 
 