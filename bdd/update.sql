-- 11/11/22
alter table tarif_service add tserv_is_product int null default 0;
alter table fact_service add fserv_is_product int null default 0;

-- 29/11/22
alter table encharge add encharge_fact_to_gest int null default 0;
alter table encharge add encharge_fact_to_soc int null default 0;

-- 01/12/22
alter table encaissement add enc_is_hosp int null default 0;

-- 15/12/22
alter table encharge add encharge_printed int null default 0;


-- 6/02/2023
alter table article add art_unite_stk2 varchar(50) null;
alter table article add art_conditionnement2 varchar(50) null;
alter table article add art_nb_box int null;

-- 18/02/2023
alter table mvmt_art add mart_det_stock text null;

-- 25/02/2023
alter table encaissement add enc_percent_tarif int null; -- tsy mahazo mihoatra ny 100
-- Table versement -- Mila fafana ilay versement ao taloha
create table if not exists versement(
    vt_id int auto_increment not null,
    vt_det text null, -- en format JSON billettage
    vt_date datetime null, -- la date du 8H: jusqu'à 8heure de la date + 1
    vt_fond_caisse_soir int null,
    vt_fond_caisse_matin int null,
    vt_total int null,
    vt_remise int null,
    vt_date_enreg datetime null default NOW(),
    primary key (vt_id)
)Engine=InnoDB; 

-- asiana colonne versement ao am encaissement hasiana ny ID an'ilay versement rehefa vita
alter table encaissement add enc_versement int null;

-- modification de la tarification pour le faire coller à une mode de pourcentage
alter table tarif add tarif_percent int null;
alter table tarif add tarif_link_id int null;


-- MODIF MAJEURE 26/04/2023
create table if not exists encmvmt(
    em_id int auto_increment not null,
    em_enc_id int null,
    em_mvmt_id int null, 
    em_validate int null default 0,
    em_date_enreg datetime null default NOW(),
    primary key (em_id)
)Engine=InnoDB; 

alter table mvmt add mvmt_caisse int null;

-- Modif 27/04/2023
alter table patient add pat_dernier_visite datetime null;
-- Alors ici on va ajouter une case à cocher côté encaissement pour pouvoir ajouté les 
-- Patient externe, ce qui veut dire que ce sont des patients pas dans la base de donnée
alter table encaissement add enc_is_externe int null;
alter table encaissement add enc_pat_externe varchar(255) null;

-- Modif 28/04/2023
alter table service add service_rang int null;

-- Modif 02/05/2023
alter table consultation add cons_is_pec int null default 0;
alter table consultation add cons_pec_id int null;
alter table consultation add cons_entpayeur_id int null;

-- MODIF 05/05/2023
alter table enc_avance add encav_validate int null default 0; -- Validation de l'avance dans l'encaissement
alter table enc_avance add encav_versement int null; -- le truc qui va contenir l'id du versement
alter table enc_avance add encav_date_validation datetime null;
alter table enc_avance add encav_util_validate int null;
alter table enc_avance add encav_mode_paiement varchar(10) null;
alter table enc_avance add encav_num_banque varchar(255) null;


-- Modif 29/05/2023
create table if not exists user_historic(
    uh_id int auto_increment not null,
    uh_user_id int null,
    uh_extras text null,
    uh_date datetime null default NOW(),
    uh_code varchar(50) null,
    uh_module varchar(255) null,
    uh_description text null,
    uh_obs text null,
    primary key (uh_id)
)Engine=InnoDB; 

-- Modif 01/05/2023 // pour l'insertion de la prescription dans la base de donnée
-- j'ai une idée : 
-- pourquoi ne pas crée juste une propriété pour l'encserv
-- comme par exemple encserv_is_prescription : 0
-- c'est pas vraiment une bonne idée

-- alter table enc_serv add encserv_is_prescription int null default 0;
alter table encaissement add enc_montant_prescription int null;

-- voilà la nouvelle table pour accuellir les médicaments dans prescription
create table if not exists enc_prescri(
    encp_id int auto_increment not null,  
    encp_serv_id int null,
    encp_is_product int null default 0,
    encp_enc_id int null,
    encp_qt int null,
    encp_montant int null,
    encp_prix_unit int null,
    encp_date_enreg datetime default NOW(),
    primary key (encp_id)
)Engine=InnoDB; 

-- Et encore une autre
-- Modification facture 13/06/2023
alter table facture add fact_code_patient varchar(255) null;


-- Modif 26/06/2023
alter table facture add fact_montant_soc int null;
alter table facture add fact_montant_pat int null;

-- Modif 29/06/2023
create table if not exists factpec(
    fpc_id int auto_increment not null,
    fpc_date_enreg datetime null default NOW(),
    fpc_num varchar(100) null,
    fpc_date datetime null,
    fpc_sp_id int null,
    fpc_se_id int null,
    fpc_month int null,
    fpc_year int null,
    fpc_printed int null default 0,
    fpc_montant int null,
    fpc_validate int null default 0, -- validé par le médecin chef
    primary key (fpc_id)
)Engine=InnoDB; 
