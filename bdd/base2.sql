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
    module_code varchar(100) null,
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
    pat_sexe varchar(55) null,
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
    ent_pat_percent varchar(50), -- pourcentage aloanle patient
    ent_soc_percent varchar(50), -- pourcentage aloanle e/se
    ent_adresse varchar(50) null, 
    ent_date_enreg datetime null default NOW(),
    ent_util_id int null,
    primary key (ent_id)
)Engine=InnoDB; 
 


-- Table Service
create table if not exists service(
    service_id int auto_increment not null, 
    service_label varchar(50) null,
    service_code varchar(50) null,
    service_parent_id int null,
    service_date_enreg datetime null default NOW(),  
    service_util_id int null,
    primary key (service_id)
)Engine=InnoDB; 

-- Relation service et tarif
create table if not exists tarif_service (
    tserv_id int auto_increment not null,
    tserv_tarif_id int null,
    tserv_service_id int null,
    tserv_is_product int null default 0,
    tserv_prix int null,
    primary key (tserv_id)
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
    vt_id int auto_increment not null,
    vt_enc_id int null,
    vt_det text null, -- en format JSON
    vt_total int null,
    vt_remise int null,
    vt_date_enreg datetime null default NOW(),
    primary key (vt_id)
)Engine=InnoDB; 
 
-- mardi 25 oct 2022
-- Table fournisseur
create table if not exists fournisseur(
    fourn_id int auto_increment not null, 
    fourn_label varchar(50) null, 
    fourn_date_enreg datetime null default NOW(),
    fourn_adresse varchar(70) null,
    fourn_code varchar(100) null,
    fourn_nif varchar(70) null,
    fourn_stat varchar(70) null,
    fourn_info varchar(250) null,
    fourn_tva int null,
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
    art_parent_cat_id int null,
    art_cat_id int null,
    art_code varchar(100) null, 
    art_fourn_id int null, 
    art_date_enreg datetime null default NOW(),
    art_label varchar(100) null, 
    art_unite_stk varchar(50) null,
    art_unite_stk2 varchar(50) null,
    art_conditionnement2 varchar(50) null,
    art_nb_box int null,
    art_conditionnement varchar(50) null,
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
    encharge_fact_to_gest int null default 0,
    encharge_fact_to_soc int null default 0
    encharge_printed int null default 0,
    primary key (encharge_id)
)Engine=InnoDB; 
 

-- Table consultation
create table if not exists consultation(
    cons_id int auto_increment not null, 
    cons_pat_id int null, 
    cons_ent_id int null,  
    cons_code int null, 
    cons_montant int null, 
    cons_date_enreg datetime null default NOW(), 
    cons_montant_calc int null,
    cons_medcin varchar(200), 
    cons_util_id int null,
    cons_num_dossier varchar(50) null,
    primary key (cons_id)
)Engine=InnoDB; 

-- Table création des saisies d'entrée en Stock
create table if not exists mvmt (
    mvmt_id int auto_increment not null,
    mvmt_num varchar(20),
    mvmt_action varchar(50) null, -- ohatra : entre, sortie
    mvmt_type varchar(50) null, -- ohatra : achat, sortie interne, vente, ...
    mvmt_tiers int null, -- raha entrée ny action de fournisseur ny eo, fa raha sortie de département
    mvmt_date_enreg datetime null default NOW(),
    mvmt_date datetime null,
    mvmt_depot_exp int null,
    mvmt_depot_dest int null,
    mvmt_util_id int null,
    mvmt_montant int null,
    primary key (mvmt_id)
)Engine=InnoDB;

-- Table contenant les mouvements et les articles
create table if not exists mvmt_art (
    mart_id int auto_increment not null,
    mart_qt int null, -- quantité de l'article demandée
    mart_art_id int null,
    mart_mvmt_id int null,
    mart_prix_unit int null,
    mart_date_enreg datetime null default NOW(),
    mart_montant int null,
    mart_det_stock text null,
    primary key (mart_id)
)Engine=InnoDB;


-- Table de facture du prise en charge
-- create table if not exists facture (
--     fact_id int auto_increment not null,
--     fact_type varchar(50), --  Eto le hoe prise en charge na zavatra hafa
--     fact_date_enreg datetime null default NOW(), -- date de la facture
--     fact_dep_id int null, -- departement 
--     fact_encharge_id int null, -- id de la prise en charge
--     fact_resume_intervention text null, -- ty lé résumé des interventions
--     primary key (fact_id)
-- )Engine=InnoDB; 

-- -- Table associatio désignation des actes et factures
-- create table if not exists fact_service (
--     fserv_id int auto_increment not null,
--     fserv_qt int null, -- quantité des services
--     fserv_fact_id int null, -- id de la facture
--     fserv_serv_id int null, -- id an'ilay désignation des actes // na koa produits no iantsoana azy
--     -- satri izy io mety ho article zany hoe fanafody
--     fserv_prix_unitaire int null, --reto zavatra reto tokony efa hita any am stock re tokony ho izy
--     fserv_montant int null, -- montant rehefa vita ny calcul prix unitaire sy QT
--     fserv_prix_patient int null,
--     fserv_prix_societe int null,
--     primary key(fserv_id)
-- )Engine=InnoDB;
 

-- Table facture
create table if not exists facture(
    fact_id int auto_increment not null, 
    fact_type int null, 
    fact_dep_id int null, 
    fact_encharge_id int null, 
    fact_resume_intervention text null,
    fact_montant int null,
    fact_date datetime null,
    fact_date_enreg datetime null default NOW(),  
    primary key (fact_id)
)Engine=InnoDB;
 

-- Table fact_service
create table if not exists fact_service(
    fserv_id int auto_increment not null, 
    fserv_qt int null,
    fserv_fact_id int null, 
    fserv_serv_id int null, 
    fserv_prix_unitaire int null,  
    fserv_montant int null,  
    fserv_prix_patient int null,  
    fserv_prix_societe int null,  
    fserv_is_product int null default 0,
    fserv_date_enreg datetime null default NOW(),  
    primary key (fserv_id)
)Engine=InnoDB; 

-- new 22/11/22 #############################
-- Table pour l'encaissement
create table if not exists encaissement(
    enc_id int auto_increment not null,  
    enc_validate int null default 0, -- validation de paiment / zany hoe tsy mila encaisser-na tsony
    enc_pat_id int null,
    enc_util_id int null,
    enc_tarif_id int null,
    enc_is_pec int null default 0, -- si c'est prise en charge ou non
    enc_ent_id int null, -- si prise en charge
    enc_date datetime null,
    enc_util_validate_id int null, -- la personne qui a validé le truc // qui a fait le paiment
    enc_date_enreg datetime default NOW(),
    enc_montant int null, -- montant total du truc
    enc_num_mvmt int null, -- Numéro du mouvement //je ne sais pas encore
    enc_num_hosp varchar(255) null, -- Ref hospitalisation
    enc_mode_paiement varchar(100) null,
    enc_is_hosp int null default 0,
    enc_dep_id int null,
    enc_remboursement int null,
    enc_reste_paie int null,
    enc_date_validation datetime null,
    enc_num_banque varchar(255) null,
    enc_fin varchar(255) null, -- Tena tsy azoko mintsy io an !!????
    enc_date_entre datetime null default NOW(),
    enc_date_sortie datetime null,
    enc_total_avance int null default 0, -- Total des avances en mode Hosp
    enc_result_final int null,
    enc_to_caisse int null default 1,
    enc_date_update datetime null,
    enc_paie_final datetime null,
    enc_percent_tarif int null, -- tsy mahazo mihoatra ny 100%
    primary key (enc_id)
)Engine=InnoDB; 

-- Table encaissement avance en mode hosp
create table if not exists enc_avance(
    encav_id int auto_increment not null, 
    encav_util_id int null,
    encav_enc_id int null,
    encav_montant int null,
    encav_date datetime null,
    encav_date_enreg datetime default NOW(),
    primary key (encav_id)
)Engine=InnoDB; 

-- Table encaissement_service // liaison entre encaissement et service
create table if not exists enc_serv(
    encserv_id int auto_increment not null,  
    encserv_serv_id int null,
    encserv_is_product int null default 0,
    encserv_enc_id int null,
    encserv_qt int null,
    encserv_montant int null,
    encserv_prix_unit int null,
    encserv_date_enreg datetime default NOW(),
    primary key (encserv_id)
)Engine=InnoDB; 


-- LES TABLES POUR LE DENTISTERIE 07/01/2023

-- Table Patient pour DENTISTERIE
create table if not exists patient_dt(
    pat_id int auto_increment not null, 
    pat_nom_et_prenom varchar(150) null,
    pat_date_naiss datetime null,
    pat_date_enreg datetime null default NOW(), 
    pat_adresse varchar(100) null, 
    pat_profession varchar(50) null,  
    pat_sexe varchar(55) null,
    pat_numero varchar(20) null, 
    pat_util_id int null,
    pat_is_dt int null default 1,
    pat_date_enreg datetime default NOW(),
    primary key (pat_id)
)Engine=InnoDB;

-- Table pour le rendez-vous journalier
create table if not exists rdv_dt(
    rdv_id int auto_increment not null,
    rdv_date datetime null default NOW(),
    rdv_intervention int null,
    rdv_arrived int null default 0,
    rdv_med_id int null,
    rdv_date datetime null,
    rdv_pat_id int null, -- id du patient qui va faire le rendez vous,
    rdv_date_enreg datetime default NOW(),
    rdv_heure varchar(20) null,
    primary key (rdv_id)
)Engine=InnoDB;

-- Table pour la liste des médecins
create table if not exists med_dt(
    med_id int auto_increment not null,
    med_date_enreg datetime null default NOW(),
    med_label varchar(255) null,
    primary key (med_id)
)Engine=InnoDB;

-- Table pour la liste des interventions RDV
create table if not exists inter_rdv_dt(
    interdv_id int auto_increment not null,
    interdv_date_enreg datetime null default NOW(),
    interdv_label varchar(255) null,
    primary key (intrdv_id)
)Engine=InnoDB;

-- table produits dentisterie
create table if not exists produit_dt(
    prod_id int auto_increment not null,
    prod_date_enreg datetime null default NOW(),
    pro_label varchar(255) null,
    prod_code varchar(20) null,
    prod_cum_appro varchar(100) null,
    prod_unite varchar(50) null,
    prod_nb_util int null,
    prod_pr_personnel int null default 0, -- pr veut dire prix, ce sont les tarifs de ces produits écris à la main
    prod_pr_retraite int null default 0,
    prod_pr_enfcd int null default 0,
    primary key (prod_id)
)Engine=InnoDB;




 
 
