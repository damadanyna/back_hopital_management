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
