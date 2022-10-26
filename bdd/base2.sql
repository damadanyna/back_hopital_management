
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
    primary key (pat_id)
)Engine=InnoDB;
 

-- Table Entreprise
create table if not exists entreprise(
    ent_id int auto_increment not null, 
    ent_label varchar(50) null, 
    ent_date_enreg datetime null default NOW(),
    primary key (ent_id)
)Engine=InnoDB; 
 

-- Table Payement
create table if not exists payement(
    pai_id int auto_increment not null, 
    pai_label varchar(50) null, 
    pai_date_enreg datetime null default NOW(),
    primary key (pai_id)
)Engine=InnoDB; 
 

-- Table Service
create table if not exists service(
    service_id int auto_increment not null, 
    service_label varchar(50) null, 
    service_date_enreg datetime null default NOW(),  
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
    primary key (tarif_id)
)Engine=InnoDB; 
 

-- Table Departement
create table if not exists departement(
    dep_id int auto_increment not null, 
    dep_label varchar(50) null, 
    dep_code varchar(100) null,
    dep_date_enreg datetime null default NOW(),
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
    primary key (hosp_id)
)Engine=InnoDB; 
 

-- Table versement
create table if not exists versement(
    versmnt_id int auto_increment not null,  
    versmnt_date_versement datetime null,
    dep_id int not null, 
    versmnt_font_caisse int not null,
    versmnt_recette_esp int not null,
    versmnt_recette_total int not null,
    versmnt_total_cheque int not null,
    versmnt_total_versement int not null,  
    versmnt_rembourser int not null,
    versmnt_date_enreg datetime null default NOW(),
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
    id_parent_article int not null,
    art_code int not null, 
    fourn_id int not null, 
    art_date_enreg datetime null default NOW(),
    art_label varchar(50) null, 
    primary key (art_id)
)Engine=InnoDB; 
 

-- Table depot
create table if not exists depot(
    depot_id int auto_increment not null, 
    depot_article_id int not null,
    depot_stock_init int not null, 
    depot_stock_final int not null, 
    depot_date_enreg datetime null default NOW(), 
    primary key (depot_id)
)Engine=InnoDB; 
 

-- Table stock_article
create table if not exists stock_article(
    stock_id int auto_increment not null, 
    depot_id int not null,
    art_id int not null, 
    stock_unit int not null, 
    stock_min int not null, 
    stock_condi varchar(50),
    stock_emplacement varchar(50), 
    stock_prix_unit int not null, 
    stock_prix_tot int not null, 
    stock_article_date_enreg datetime null default NOW(), 
    primary key (stock_id)
)Engine=InnoDB; 
 