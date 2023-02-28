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
    vt_enc_id int null,
    vt_det text null, -- en format JSON
    vt_total int null,
    vt_remise int null,
    vt_date_enreg datetime null default NOW(),
    primary key (vt_id)
)Engine=InnoDB; 