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