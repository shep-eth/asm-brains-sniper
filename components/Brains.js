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
    "https://opensea.io/assets/0xd0318da435dbce0b347cc6faa330b5a9889e3585",
  looksrare:
    "https://looksrare.org/collections/0xd0318da435dbce0b347cc6faa330b5a9889e3585",
  x2y2: "https://x2y2.io/eth/0xD0318da435DbcE0B347cc6faA330B5A9889e3585/3075",
};

const columns = [
  { id: "index", label: "#" },
  { id: "tokenId", label: "Brain ID" },
  { id: "price", label: "Listing Price", format: (v) => `Ξ${v}` },
  {
    id: "link",
    label: "Marketplace Link",
    format: (v) => (
      <a href={v} target="_blank" rel="noreferrer">
        {v}
      </a>
    ),
  },
  {
    id: "claimed",
    label: "Airdrop Available?",
    format: (v) =>
      v ? (
        <Chip label="No" color="primary" variant="outlined" />
      ) : (
        <Chip label="Yes" color="success" />
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
        <Grid container spacing={2} columns={16}>
          <Grid item xs={8}>
            <h1>ASM Brains Checker</h1>
          </Grid>
          <Grid item xs={8}>
            <Chip
              sx={{ float: "right", marginTop: "30px" }}
              label={`Data updated at: ${moment(updatedAt).fromNow()} (${moment(
                updatedAt
              ).format("LTS")})`}
            />
          </Grid>
        </Grid>
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
                            {column.format ? column.format(value) : value}
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
