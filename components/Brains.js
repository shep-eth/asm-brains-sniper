import moment from "moment";
import Link from "next/link";
import { useState } from "react";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import Container from "./Container";

const marketLinks = {
  opensea:
    "https://opensea.io/assets/ethereum/0xd0318da435dbce0b347cc6faa330b5a9889e3585",
  looksrare:
    "https://looksrare.org/collections/0xd0318da435dbce0b347cc6faa330b5a9889e3585",
  x2y2: "https://x2y2.io/eth/0xD0318da435DbcE0B347cc6faA330B5A9889e3585",
};

const formatIQ = (iq, data) => {
  return (
    <a
      href={`https://alphafarm.io/community/altered-state-machine?brainId=${data.tokenId}`}
      target="_blank"
      rel="noreferrer"
    >
      {iq || "?"}
    </a>
  );
};

const columns = [
  { id: "index", label: "#" },
  { id: "tokenId", label: "Brain ID" },
  { id: "price", label: "Listing Price", format: (v, r) => `Ξ${v}` },
  { id: "iq", label: "IQ", format: formatIQ },
  {
    id: "claimed",
    label: "Airdrop Available?",
    format: (v, r) =>
      v ? (
        <Chip label="No" color="primary" variant="outlined" />
      ) : (
        <Chip label="Yes" color="success" />
      ),
  },
  {
    id: "link",
    label: "Marketplace Link",
    format: (v, r) => (
      <a href={v} target="_blank" rel="noreferrer">
        {v}
      </a>
    ),
  },
];

function Brains({ data, updatedAt }) {
  const rows = data;
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Container>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Grid container columns={16}>
          <Grid item xs={8}>
            <h1>ASM Brains Sniper</h1>
          </Grid>
          <Grid item xs={8}>
            <Chip
              sx={{ float: "right", marginTop: "30px" }}
              label={`Data updated: ${moment(updatedAt).fromNow()} (${moment(
                updatedAt
              ).format("LTS")})`}
            />
          </Grid>
        </Grid>
        <p>
          Disclaimer: This is NOT an official tool. We and the tool are not
          responsible for the accuracy, reliability or completeness of the data
          provided. Please visit {""}
          <a href="https://alphafarm.io/" target="_blank" rel="noreferrer">
            AlphaFarm
          </a>
          , {""}
          <a
            href="https://cortex.alteredstatemachine.xyz/claimedCheck"
            target="_blank"
            rel="noreferrer"
          >
            ASM Brains Claim Check
          </a>{" "}
          {""}
          and NFT marketplaces to verify. IQ data from AlphaFarm is purely
          speculative and not endorsed by ASM. ASM has not yet released how they
          will assess the Genome Matrixes for IQ in any use-case - DYOR, this is
          not financial advice.
        </p>
        <TableContainer>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  row.index = page * rowsPerPage + index + 1;
                  row.link = `${marketLinks[row.market]}/${row.tokenId}`;
                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      tabIndex={-1}
                      key={row.tokenId}
                    >
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format ? column.format(value, row) : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
}
export default Brains;
